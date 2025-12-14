namespace Domain.IRepository;

using Domain.Model;


public interface IDataRequestRepository : IGenericRepository<DataRequest>
{
    Task<IEnumerable<DataRequest>> GetAllDataRequests();
    Task<DataRequest?> GetDataRequestByIdAsync(long id);
    Task<IEnumerable<DataRequest>> GetDataRequestsByEmailAsync(string email);
    Task<IEnumerable<DataRequest>> GetDataRequestsByTypeAsync(DataRequestType requestType);
    Task<IEnumerable<DataRequest>> GetDataRequestsByStatusAsync(DataRequestStatus status);
    Task<DataRequest> AddDataRequestAsync(DataRequest dataRequest);
}