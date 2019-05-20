const {withUiHook, htm} = require('@zeit/integration-utils');

module.exports = withUiHook(async ({payload, zeitClient}) => {
	const {clientState, action} = payload;
	const store = await zeitClient.getMetadata();

	if (action === 'submit') {
		store.secretId = clientState.secretId;
		store.secretKey = clientState.secretKey;
		await zeitClient.setMetadata(store);
	}

	if (action === 'reset') {
		store.secretId = '';
		store.secretKey = '';
		await zeitClient.setMetadata(store);
	}

	return htm`
		<Page>
			<Container>
				<Input label="Secret Id" name="secretId" value=${store.secretId || ''} />
				<Input label="Secret Key" name="secretKey" type="password" value=${store.secretKey || ''} />
			</Container>
			<Container>
				<Button action="submit">Submit</Button>
				<Button action="reset">Reset</Button>
			</Container>
		</Page>
	`
});
