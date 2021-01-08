const {withUiHook, htm} = require('@zeit/integration-utils');

const store = {
	secretId: '',
	secretKey: ''
};

module.exports = withUiHook(async ({payload}) => {
	const {clientState, action} = payload;

	if (action === 'submit') {
		store.secretId = clientState.secretId;
		store.secretKey = clientState.secretKey;
	}

	if (action === 'reset') {
		store.secretId = '';
		store.secretKey = '';
	}

	return htm`
		<Page>
			<Container>
				<Input label="Secret Id" name="secretId" value=${store.secretId} />
				<Input label="Secret Key" name="secretKey" value=${store.secretKey} />
			</Container>
			<Container>
				<Button action="submit">Submit</Button>
				<Button action="reset">Reset</Button>
			</Container>
			<AutoRefresh timeout=${3000} />
		</Page>
	`
});
