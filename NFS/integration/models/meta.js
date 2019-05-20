module.exports = {
  'deployments': {
    'id': {
      'title': 'Deployment Id',
      'required': true
    },
    'bucket_name': {
      'title': 'Bucket Name',
      'required': true
    },
    'lambda_region': {
      'title': 'Deployment Region',
      'required': true
    },
    'region': {
      'title': 'Region',
      'required': true
    },
    'endpoint': {
      'title': 'Endpoint',
      'required': true
    },
    'alias': {
      'title': 'Alias',
      'required': false
    },
    'created_at': {
      'title': 'Created At',
      'required': false
    }
  },
  'code': {
    'title': 'OAuth Access Code',
    'required': true
  }
}
