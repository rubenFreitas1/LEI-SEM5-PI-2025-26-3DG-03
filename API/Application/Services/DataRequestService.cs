namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;

public class DataRequestService
{

    private readonly IDataRequestRepository _dataRequestRepository;

    private readonly ISystemUserRepository _systemUserRepository;

    private readonly IRepresentativeRepository _representativeRepository;
    
    private readonly IDataRequestFactory _dataRequestFactory;

    public DataRequestService(IDataRequestRepository dataRequestRepository, IDataRequestFactory dataRequestFactory, ISystemUserRepository systemUserRepository, IRepresentativeRepository representativeRepository)
    {
        _dataRequestRepository = dataRequestRepository;
        _dataRequestFactory = dataRequestFactory;
        _systemUserRepository = systemUserRepository;
        _representativeRepository = representativeRepository;
    }

    public async Task<IEnumerable<DataRequestDTO>> GetAllDataRequests()
    {
        IEnumerable<DataRequest> dataRequests = await _dataRequestRepository.GetAllDataRequests();
        return DataRequestDTO.ToDTO(dataRequests);
    }

    public async Task<DataRequestDTO?> GetDataRequestById(long id)
    {
        DataRequest? dataRequest = await _dataRequestRepository.GetDataRequestByIdAsync(id);
        if (dataRequest != null)
        {
            DataRequestDTO dataRequestDTO = DataRequestDTO.ToDTO(dataRequest);
            return dataRequestDTO;
        }
        return null;
    }

    public async Task<IEnumerable<DataRequestDTO>> GetDataRequestsByEmail(string email)
    {
        IEnumerable<DataRequest> dataRequests = await _dataRequestRepository.GetDataRequestsByEmailAsync(email);
        return DataRequestDTO.ToDTO(dataRequests);
    }

    public async Task<IEnumerable<DataRequestDTO>> GetDataRequestsByType(DataRequestType requestType)
    {
        IEnumerable<DataRequest> dataRequests = await _dataRequestRepository.GetDataRequestsByTypeAsync(requestType);
        return DataRequestDTO.ToDTO(dataRequests);
    }

    public async Task<IEnumerable<DataRequestDTO>> GetDataRequestsByStatus(DataRequestStatus status)
    {
        IEnumerable<DataRequest> dataRequests = await _dataRequestRepository.GetDataRequestsByStatusAsync(status);
        return DataRequestDTO.ToDTO(dataRequests);
    }

    public async Task<DataRequestDTO?> CreateDataRequest(DataRequestDTO dataRequestDTO, List<string> errorMessages)
    {
        if(dataRequestDTO == null)
        {
            errorMessages.Add($"DataRequestDTO is null.");
            return null;
        }
        if(string.IsNullOrEmpty(dataRequestDTO.SystemUserEmail))
        {
            errorMessages.Add($"System user email is required.");
            return null;
        }
        var systemUser = await _systemUserRepository.GetSystemUserByEmailAsync(dataRequestDTO.SystemUserEmail);
        if(systemUser == null)
        {
            var representative = await _representativeRepository.GetRepresentativeByEmailAsync(dataRequestDTO.SystemUserEmail);
            if(representative == null)
            {
                errorMessages.Add($"No system user or representative found with email {dataRequestDTO.SystemUserEmail}.");
                return null;
            }
        }
        DataRequest dataRequest;
        try
        {
            dataRequest = _dataRequestFactory.NewDataRequest(dataRequestDTO.RequestType, dataRequestDTO.SystemUserEmail, dataRequestDTO.Details);
        }catch(Exception ex)
        {
            errorMessages.Add($"Error creating DataRequest: {ex.Message}");
            return null;
        }
        DataRequest dataRequestSaved = await _dataRequestRepository.AddDataRequestAsync(dataRequest);
        DataRequestDTO drDTO = DataRequestDTO.ToDTO(dataRequestSaved);
        return drDTO;
    }
    

}