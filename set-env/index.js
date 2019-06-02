const {withUiHook, htm} = require('@zeit/integration-utils')

function empty(value) {
	if (value === null || value === undefined) {
		return true
	}

	if (value.trim() === "") {
		return true
	}

	return false
}

module.exports = withUiHook(async ({payload, zeitClient}) => {
	const {clientState, action, projectId} = payload
	let notice = ''

	if (!projectId) {
		return htm`
			<Page>
				<ProjectSwitcher />
			</Page>
		`
	}

	if (action === 'submit') {
		if (empty(clientState.key) || empty(clientState.value)) {
			notice = htm`<Notice error>Both Key and Value are required.</Notice>`
		}

		const prefix = `i_${payload.slug}`
		try {
			const secretName = await zeitClient.ensureSecret(prefix, clientState.value)
			await zeitClient.upsertEnv(projectId, clientState.key, secretName)
			notice = htm`<Notice>Completed</Notice>`
		} catch(err) {
			notice = htm`<Notice error>Error: ${err.message}</Notice>`
		}
	}


	return htm`
		<Page>
			${notice}
			<Container>
				<Input label="Key" name="key" />
				<Input label="Value" name="value" />
			</Container>
			<Container>
				<Button action="submit">Submit</Button>
			</Container>
		</Page>
	`
})
