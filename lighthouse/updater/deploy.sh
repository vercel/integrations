#!/usr/bin/env bash
set -euo pipefail

if [ -z "${API_SECRET:-}" ]; then
  echo "missing environment variable: API_SECRET" >&2
  exit 1
fi

if [ -z "${HOST:-}" ]; then
  echo "missing environment variable: HOST" >&2
  exit 1
fi

region=us-west-1
role_name=lhi-updater
function_name=lhi-updater
rule_name=lhi-updater-rule
permission_id=lhi-updater-event
handler="index.handler" \
timeout=120
schedule="rate(1 minute)"
endpoint="${HOST}/update"
environment="Variables={API_SECRET=$API_SECRET,ENDPOINT=$endpoint}"
zipfile="${TMPDIR}${function_name}-$(date +%s).zip"

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "> building: $zipfile"
cd src
zip -r -X "$zipfile" .
cd -

if aws iam get-role --role-name "$role_name" > /dev/null 2>&1; then
  echo "> updating role"
  aws iam update-assume-role-policy \
    --policy-document file://policy.json \
    --role-name "$role_name"
else
  echo "> creating role"
  aws iam create-role \
    --assume-role-policy-document file://policy.json \
    --role-name "$role_name"
fi

echo "> attaching role policy"
aws iam attach-role-policy \
  --policy-arn "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess" \
  --role-name "$role_name"

role_arn="$(aws iam get-role --role-name "$role_name" | jq -er '.Role.Arn')"

if aws lambda get-function --function-name ${function_name} --region "$region" > /dev/null 2>&1; then
  echo "> updating function configuratiion"
  aws lambda update-function-configuration \
    --environment "$environment" \
    --function-name $function_name \
    --region "$region" \
    --timeout "$timeout"

  echo "> updating function"
  response="$(aws lambda update-function-code \
    --function-name "$function_name" \
    --region "$region" \
    --zip-file "fileb://$zipfile")"

  function_arn="$(jq -er '.FunctionArn' <<< "$response")"
else
  echo "> creating function"
  response="$(aws lambda create-function \
    --environment "$environment" \
    --function-name "$function_name" \
    --handler "$handler" \
    --region "$region" \
    --role "$role_arn" \
    --runtime nodejs10.x \
    --timeout "$timeout" \
    --zip-file "fileb://$zipfile")"

  function_arn="$(jq -er '.FunctionArn' <<< "$response")"
fi

echo "> setup rule for function"
response="$(aws events put-rule \
  --name "$rule_name" \
  --region "$region" \
  --schedule-expression "$schedule")"

rule_arn="$(jq -er '.RuleArn' <<< "$response")"

permission="$(aws lambda get-policy \
  --region "$region" \
  --function-name "$function_arn" \
   | jq -er '.Policy' \
   | jq -er '.Statement[] | select(.Sid == "'"$permission_id"'")')"

if [ -z "$permission" ]; then
  echo "> adding permision for the function"
  aws lambda add-permission \
    --action 'lambda:InvokeFunction' \
    --function-name "$function_name" \
    --principal events.amazonaws.com \
    --region "$region" \
    --source-arn "$rule_arn" \
    --statement-id "$permission_id"
fi

echo "> updating target function to invoke"
aws events put-targets \
  --region "$region" \
  --rule "$rule_name" \
  --targets "Id=1,Arn=$function_arn"
