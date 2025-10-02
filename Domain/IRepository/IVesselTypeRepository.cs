namespace Domain.Repository;

using Domain.IRepository;
using Domain.Model;
using ShippingManagement.Domain.Vessels;

public interface IVesselTypeRepository : IGenericRepository<VesselType>
{
    Task<IEnumerable<VesselType>> GetVesselTypesAsync();

    Task<VesselType> GetVesselTypeByNameAsync(string name);

    Task<VesselType> GetVesselTypeByIdAsync(long id);

    Task<VesselType> GetVesselTypeByDescriptionAsync(string description);

    Task<VesselType> Add(VesselType vesselType);

    Task<VesselType> Update(VesselType vesselType, List<string> errorMessages);

}