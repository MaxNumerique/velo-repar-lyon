import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist the mock functions
const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
}))

// 2. Mock nodemailer BEFORE importing sendEmail
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail
    }))
  }
}))

import { sendEmail } from '../mail'

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_EMAIL = 'sender@example.com'
    // Ensure the default mock implementation is set back for each test
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
  })

  it('sends an email with correct parameters', async () => {
    const to = 'recipient@example.com'
    const subject = 'Test Subject'
    const text = 'Hello world'
    const html = '<h1>Hello world</h1>'

    const info = await sendEmail(to, subject, text, html)

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Velo Du Pelo" <sender@example.com>',
      to,
      subject,
      text,
      html
    })
    expect(info.messageId).toBe('test-id')
  })

  it('throws an error if sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP Error'))

    await expect(sendEmail('to@ex.com', 'S', 'T', 'H')).rejects.toThrow('SMTP Error')
  })
})
