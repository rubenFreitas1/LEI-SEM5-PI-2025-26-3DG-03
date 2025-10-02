namespace Domain.Factory;

using Domain.Model;
using ShippingManagement.Domain.Vessels;

public class VesselTypeFactory : IVesselTypeFactory
{
    public VesselType newVesselType(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
    {
        return new VesselType(name, description, capacity, maxRows, maxBays, maxTiers);
    }
}