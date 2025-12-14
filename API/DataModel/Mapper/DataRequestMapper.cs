namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;

public class DataRequestMapper
{
    private readonly IDataRequestFactory _dataRequestFactory;

    public DataRequestMapper(IDataRequestFactory dataRequestFactory)
    {
        _dataRequestFactory = dataRequestFactory;
    }

    public DataRequest ToDomain(DataRequestDataModel dataRequestDM)
    {
        DataRequest dataRequestDomain = new DataRequest(
            Enum.Parse<DataRequestType>(dataRequestDM.RequestType),
            dataRequestDM.SystemUserEmail,
            dataRequestDM.Details,
            dataRequestDM.RequestedAt
        );
        dataRequestDomain.Id = dataRequestDM.Id;
        dataRequestDomain.Status = Enum.Parse<DataRequestStatus>(dataRequestDM.RequestStatus);
        return dataRequestDomain;
    }

    public IEnumerable<DataRequest> ToDomain(IEnumerable<DataRequestDataModel> dataRequestDMs)
    {
        List<DataRequest> dataRequestsDomain = new List<DataRequest>();
        foreach (DataRequestDataModel dataRequestDM in dataRequestDMs)
        {
            DataRequest dataRequest = ToDomain(dataRequestDM);
            dataRequestsDomain.Add(dataRequest);
        }
        return dataRequestsDomain.AsEnumerable();
    }

    public DataRequestDataModel ToDataModel(DataRequest dataRequest)
    {
        return new DataRequestDataModel(dataRequest);
    }

    
}