namespace Domain.Factory;

using Domain.Model;

public interface IDataRequestFactory
{
    DataRequest NewDataRequest(DataRequestType requestType, string email, string? details);
}