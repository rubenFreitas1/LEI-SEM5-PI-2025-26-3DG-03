using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Model.Resources
{
    public enum PhysicalResourceKind
    {
        STSCrane,
        MobileCrane,
        Truck,
        Other
    }

    public class PhysicalResource : Resource
    {
        public string PhysicalResourceCode { get; private set; }
        public string PhysicalResourceDescription { get; private set; }
        public PhysicalResourceKind PhysicalResourceKind { get; private set; }
        public int? PhysicalResourceSetupTimeMinutes { get; private set; }
        public int PhysicalResourceOperationalCapacity { get; private set; }
        public string? PhysicalResourceAssignedStorageAreaCode { get; private set; }
        public string? PhysicalResourceAssignedDockName { get; private set; }
        protected PhysicalResource() : base()
        {
            PhysicalResourceCode = string.Empty;
            PhysicalResourceDescription = string.Empty;
        }

        public PhysicalResource(string code, string name, string description, PhysicalResourceKind kind,
            IEnumerable<Qualification> qualificationRequirements, int operationalCapacity,
            OperationalWindow operationalWindow, int? setupTimeMinutes = null,
            ResourceStatus status = ResourceStatus.Available)
            : base(name, qualificationRequirements, operationalWindow, status)
        {
            ValidateCode(code);
            ValidateDescription(description);
            ValidateOperationalCapacity(operationalCapacity);

            PhysicalResourceCode = code.Trim();
            PhysicalResourceDescription = description.Trim();
            PhysicalResourceKind = kind;
            PhysicalResourceOperationalCapacity = operationalCapacity;
            PhysicalResourceSetupTimeMinutes = setupTimeMinutes;
        }

        public void ChangeDescription(string description)
        {
            ValidateDescription(description);
            PhysicalResourceDescription = description.Trim();
        }

        public void AssignToStorageArea(string storageAreaCode)
        {
            if (PhysicalResourceKind == PhysicalResourceKind.STSCrane)
                throw new InvalidOperationException("STS Cranes cannot be assigned to storage areas. They must be assigned to docks.");

            if (PhysicalResourceKind == PhysicalResourceKind.MobileCrane)
                throw new InvalidOperationException("Mobile Cranes are mobile and cannot be assigned to specific areas.");

            if (string.IsNullOrWhiteSpace(storageAreaCode))
                throw new ArgumentException("Storage area code cannot be null or empty.", nameof(storageAreaCode));

            PhysicalResourceAssignedStorageAreaCode = storageAreaCode.Trim();

            PhysicalResourceAssignedDockName = null;
        }

        public void AssignToDock(string dockName)
        {
            if (PhysicalResourceKind != PhysicalResourceKind.STSCrane)
                throw new InvalidOperationException("Only STS Cranes can be assigned to docks.");

            if (string.IsNullOrWhiteSpace(dockName))
                throw new ArgumentException("Dock name cannot be null or empty.", nameof(dockName));

            PhysicalResourceAssignedDockName = dockName.Trim();

            PhysicalResourceAssignedStorageAreaCode = null;
        }

        public void RemoveAssignment()
        {
            if (PhysicalResourceKind == PhysicalResourceKind.STSCrane)
                throw new InvalidOperationException("STS Cranes must be assigned to a dock.");

            if (PhysicalResourceKind == PhysicalResourceKind.Truck)
                throw new InvalidOperationException("Trucks must be assigned to a storage area (yard).");


            PhysicalResourceAssignedStorageAreaCode = null;
            PhysicalResourceAssignedDockName = null;
        }

        public void ChangeOperationalCapacity(int capacity)
        {
            ValidateOperationalCapacity(capacity);
            PhysicalResourceOperationalCapacity = capacity;
        }

        public void ChangeSetupTime(int? minutes)
        {
            if (minutes.HasValue && minutes < 0) throw new ArgumentOutOfRangeException(nameof(minutes), "Setup time cannot be negative.");
            PhysicalResourceSetupTimeMinutes = minutes;
        }

        public void ChangeKind(PhysicalResourceKind kind)
        {
            PhysicalResourceKind = kind;
        }

        public void Deactivate()
        {
            ChangeStatus(ResourceStatus.Unavailable);
        }

        public void Reactivate()
        {
            ChangeStatus(ResourceStatus.Available);
        }

        private static void ValidateCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Code cannot be null or empty.", nameof(code));
            var trimmed = code.Trim();
            if (trimmed.Length > 20) throw new ArgumentException("Code must be at most 20 characters long.", nameof(code));
            if (!Regex.IsMatch(trimmed, "^[A-Za-z0-9-]+$")) throw new ArgumentException("Code must be alphanumeric (dashes allowed).", nameof(code));
        }

        private static void ValidateDescription(string description)
        {
            if (string.IsNullOrWhiteSpace(description)) throw new ArgumentException("Description cannot be null or empty.", nameof(description));
            if (description.Trim().Length > 250) throw new ArgumentException("Description must be at most 250 characters long.", nameof(description));
        }

        private static void ValidateOperationalCapacity(int capacity)
        {
            if (capacity < 0) throw new ArgumentOutOfRangeException(nameof(capacity), "Operational capacity cannot be negative.");
        }
    }
}
