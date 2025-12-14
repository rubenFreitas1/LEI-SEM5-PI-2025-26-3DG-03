namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;

public class DataRequestRepository : GenericRepository<DataRequest>, IDataRequestRepository
{
    DataRequestMapper _dataRequestMapper;

    public DataRequestRepository(ShippingManagementContext context, DataRequestMapper mapper) : base(context!)
    {
        _dataRequestMapper = mapper;
    }

    public async Task<IEnumerable<DataRequest>> GetAllDataRequests()
    {
        try
        {
            IEnumerable<DataRequestDataModel> dataRequestDataModels = await _context.Set<DataRequestDataModel>()
                    .ToListAsync();
            IEnumerable<DataRequest> dataRequests = _dataRequestMapper.ToDomain(dataRequestDataModels);
            return dataRequests;
        }
        catch
        {
            throw;
        }
    }

    public async Task<DataRequest?> GetDataRequestByIdAsync(long id)
    {
        try
        {
            DataRequestDataModel? dataRequestDM = await _context.Set<DataRequestDataModel>()
            .SingleOrDefaultAsync(dr => dr.Id == id);
            if (dataRequestDM != null)
            {
                DataRequest dataRequest = _dataRequestMapper.ToDomain(dataRequestDM);
                return dataRequest;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<IEnumerable<DataRequest>> GetDataRequestsByEmailAsync(string email)
    {
        try
        {
            IEnumerable<DataRequestDataModel> dataRequestDataModels = await _context.Set<DataRequestDataModel>()
            .Where(dr => dr.SystemUserEmail == email)
            .ToListAsync();
            IEnumerable<DataRequest> dataRequests = _dataRequestMapper.ToDomain(dataRequestDataModels);
            return dataRequests;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<DataRequest>> GetDataRequestsByTypeAsync(DataRequestType requestType)
    {
        try
        {
            IEnumerable<DataRequestDataModel> dataRequestDataModels = await _context.Set<DataRequestDataModel>()
            .Where(dr => dr.RequestType == requestType.ToString())
            .ToListAsync();
            IEnumerable<DataRequest> dataRequests = _dataRequestMapper.ToDomain(dataRequestDataModels);
            return dataRequests;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<DataRequest>> GetDataRequestsByStatusAsync(DataRequestStatus status)
    {
        try
        {
            IEnumerable<DataRequestDataModel> dataRequestDataModels = await _context.Set<DataRequestDataModel>()
            .Where(dr => dr.RequestStatus == status.ToString())
            .ToListAsync();
            IEnumerable<DataRequest> dataRequests = _dataRequestMapper.ToDomain(dataRequestDataModels);
            return dataRequests;
        }
        catch
        {
            throw;
        }
    }

    public async Task<DataRequest> AddDataRequestAsync(DataRequest dataRequest)
    {
        DataRequestDataModel dataRequestDM = _dataRequestMapper.ToDataModel(dataRequest);
        EntityEntry<DataRequestDataModel> addedEntity = _context.Set<DataRequestDataModel>().Add(dataRequestDM);
        await _context.SaveChangesAsync();
        return _dataRequestMapper.ToDomain(addedEntity.Entity);
    }

}