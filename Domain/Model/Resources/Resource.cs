using System;
using System.Text.RegularExpressions;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Model
{
    public abstract class Resource
    {
        public long Id { get; set; }

        public string Name { get; private set; }

        public IEnumerable<Qualification> Qualification { get; private set; }

        public OperationalWindow OperationalWindow { get; set; }

        public ResourceStatus Status { get; set; }
        public DateTime LastModifiedAt { get; set; }

        protected Resource()
        {
            Name = string.Empty;
            Qualification = null!;
            OperationalWindow = new OperationalWindow(startDay: DayOfWeek.Monday, endDay: DayOfWeek.Friday, startTime: new TimeSpan(9, 0, 0), endTime: new TimeSpan(17, 0, 0));
            Status = ResourceStatus.Available;
        }

        protected Resource(string name, IEnumerable<Qualification> qualification, OperationalWindow operationalWindow, ResourceStatus status)
        {
            ValidateName(name);
            ValidateQualification(qualification);
            ValidateOperationalWindow(operationalWindow);

            Name = name.Trim();
            Qualification = qualification;
            OperationalWindow = operationalWindow;
            Status = status;
            LastModifiedAt = DateTime.UtcNow;
        }

        public void ChangeName(string name)
        {
            ValidateName(name);
            Name = name.Trim();
            LastModifiedAt = DateTime.UtcNow;
        }

        public void ChangeQualifications(IEnumerable<Qualification> qualification)
        {
            ValidateQualification(qualification);
            Qualification = qualification;
            LastModifiedAt = DateTime.UtcNow;
        }

        public void ChangeStatus(ResourceStatus status)
        {
            Status = status;
            LastModifiedAt = DateTime.UtcNow;
        }

        public void ChangeOperationalWindow(OperationalWindow operationalWindow)
        {
            ValidateOperationalWindow(operationalWindow);
            OperationalWindow = operationalWindow;
            LastModifiedAt = DateTime.UtcNow;
        }

        private static void ValidateName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name cannot be null or empty.", nameof(name));

            var trimmed = name.Trim();
            if (trimmed.Length > 100)
                throw new ArgumentException("Name must be at most 100 characters long.", nameof(name));

            if (!Regex.IsMatch(trimmed, @"^[A-Za-z0-9\s\-_,.]+$"))
                throw new ArgumentException("Name contains invalid characters.", nameof(name));

            if (!char.IsUpper(trimmed[0]))
                throw new ArgumentException("Name must start with an uppercase letter.", nameof(name));
        }

        private static void ValidateQualification(IEnumerable<Qualification> qualification)
        {
            if (qualification == null || !qualification.Any())
                throw new ArgumentNullException(nameof(qualification), "At least one valid QualificationCode must be provided to update a Staff.");
        }

        private static void ValidateOperationalWindow(OperationalWindow operationalWindow)
        {
            if (operationalWindow == null)
                throw new ArgumentNullException(nameof(operationalWindow), "OperationalWindow cannot be null.");
        }
    }
}
