namespace Domain.IRepository;

using Domain.Model;

public interface IVesselTypeRepository : IGenericRepository<VesselType>
{
    Task<IEnumerable<VesselType>> GetVesselTypesAsync();

    Task<VesselType?> GetVesselTypeByNameAsync(string name);

    Task<VesselType?> GetVesselTypeByIdAsync(long id);

    Task<IEnumerable<VesselType?>> GetVesselTypeByDescriptionAsync(string description);

    Task<VesselType> AddVesselType(VesselType vesselType);

    Task<VesselType?> Update(VesselType vesselType, List<string> errorMessages);

    Task<bool> VesselTypeExists(long id);

}