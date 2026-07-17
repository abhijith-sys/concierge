export const EmailService = {
  async send(to: string, subject: string, body: string) {
    console.log(`[email] to=${to} subject=${JSON.stringify(subject)} body=${JSON.stringify(body)}`);
  },
};
