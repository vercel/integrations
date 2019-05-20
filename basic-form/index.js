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
		await new Promise(r => setTimeout(r, 10000))
	}

	if (action === 'reset') {
		store.secretId = '';
		store.secretKey = '';
	}

	return htm`
		<Page>
			<Container>
				<Input label="Secret Id" name="secretId" value=${store.secretId} />
				<Textarea label="The text area" name="text1" value=""/>
				<Select label="This is the select box" name="select1">
					<Option value="1" caption="v2" />
					<Option value="2" caption="v3" />
				</Select>
			</Container>
			<Container>
				<Button action="submit">Submit</Button>
				<Button action="reset">Reset</Button>
			</Container>
			<AutoRefresh timeout=${3000} />
		</Page>
	`
});
