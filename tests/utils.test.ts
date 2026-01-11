import { formatCurrency, formatPhoneNumber, calculateCommission, slugify } from '@/utils/helpers'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency in BRL', () => {
      expect(formatCurrency(500000)).toContain('500')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toContain('0')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format Brazilian phone number', () => {
      const formatted = formatPhoneNumber('11999999999')
      expect(formatted).toBe('(11) 99999-9999')
    })

    it('should return original if invalid format', () => {
      const phone = '123'
      expect(formatPhoneNumber(phone)).toBe(phone)
    })
  })

  describe('calculateCommission', () => {
    it('should calculate 6% commission', () => {
      expect(calculateCommission(500000, 6)).toBe(30000)
    })

    it('should calculate 5% commission', () => {
      expect(calculateCommission(300000, 5)).toBe(15000)
    })

    it('should handle zero commission rate', () => {
      expect(calculateCommission(500000, 0)).toBe(0)
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Casa em São Paulo')).toBe('casa-em-so-paulo')
    })

    it('should handle special characters', () => {
      expect(slugify('Apartamento 3 quartos!!')).toBe('apartamento-3-quartos')
    })

    it('should convert to lowercase', () => {
      expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text')
    })
  })
})
