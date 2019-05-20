export default async function projectRequiredView() {
  return `
		<Page>
			<Notice type="message">Please select a project first 🙏</Notice>
			<ProjectSwitcher />
		</Page>
	`;
}
