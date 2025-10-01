using System;

namespace ShippingManagement.Domain.Vessels
{
    public class VesselType
    {
        public string Name { get; private set; }

        public string Description { get; private set; }

        public int Capacity { get; private set; }

        public int MaxRows { get; private set; }

        public int MaxBays { get; private set; }

        public int MaxTiers { get; private set; }

        public VesselType(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentException("Vessel type name cannot be null or empty.", nameof(name));
            }

            if (string.IsNullOrWhiteSpace(description))
            {
                throw new ArgumentException("Vessel type description cannot be null or empty.", nameof(description));
            }

            if (capacity <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(capacity), "Capacity must be greater than zero.");
            }

            if (maxRows <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(maxRows), "Max rows must be greater than zero.");
            }

            if (maxBays <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(maxBays), "Max bays must be greater than zero.");
            }

            if (maxTiers <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(maxTiers), "Max tiers must be greater than zero.");
            }

            Name = name;
            Description = description;
            Capacity = capacity;
            MaxRows = maxRows;
            MaxBays = maxBays;
            MaxTiers = maxTiers;
        }

    }
}
