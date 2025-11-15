namespace Domain.IRepository;

using Domain.Model;

public interface IVesselRecordRepository : IGenericRepository<VesselRecord>
{
    Task<IEnumerable<VesselRecord>> GetVesselRecordsAsync();

    Task<VesselRecord?> GetVesselRecordByIdAsync(long id);

    Task<VesselRecord?> GetVesselRecordByVesselNameAsync(string name);

    Task<VesselRecord?> GetVesselRecordByImoNumberAsync(string imoNumber);

    Task<VesselRecord?> GetVesselRecordByOperatorAsync(string operatorName);

    Task<VesselRecord> AddVesselRecord(VesselRecord vesselRecord);

    Task<VesselRecord?> Update(VesselRecord vesselRecord, List<string> errorMessages);

    Task<bool> VesselRecordExists(long id);
}