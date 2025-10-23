using System;
using System.Linq;
using System.Text.RegularExpressions;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Model
{
    public class Staff : Resource
    {
        public string Email { get; private set; }

        public string Phone { get; private set; }

        protected Staff() : base() { Email = string.Empty; Phone = string.Empty; }

        public Staff(string name, IEnumerable<Qualification> qualification, string email, string phone, OperationalWindow operationalWindow, ResourceStatus status) : base(name, qualification, operationalWindow, status)
        {
            ValidateEmail(email);
            ValidatePhone(phone);

            Email = email.Trim();
            Phone = phone.Trim();
        }

        public void ChangeEmail(string email)
        {
            ValidateEmail(email);
            Email = email.Trim();
            LastModifiedAt = DateTime.UtcNow;
        }

        public void ChangePhone(string phone)
        {
            ValidatePhone(phone);
            Phone = phone.Trim();
            LastModifiedAt = DateTime.UtcNow;
        }

        private static void ValidateEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));

            var trimmed = email.Trim();
            if (trimmed.Length > 254)
                throw new ArgumentException("Email must be at most 254 characters long.", nameof(email));

            if (!Regex.IsMatch(trimmed, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                throw new ArgumentException("Email is not a valid email address.", nameof(email));
        }

        private static void ValidatePhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                throw new ArgumentException("Phone cannot be null or empty.", nameof(phone));

            var trimmed = phone.Trim();

            if (trimmed.Length != 9)
                throw new ArgumentException("Phone must be exactly 9 digits long.", nameof(phone));

            if (!Regex.IsMatch(trimmed, @"^\d+$"))
                throw new ArgumentException("Phone must contain only numeric digits.", nameof(phone));
        }
    }
}

