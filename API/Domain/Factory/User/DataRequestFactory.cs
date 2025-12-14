namespace Domain.Factory;

using Domain.Model;


public class DataRequestFactory : IDataRequestFactory
{
    public DataRequest NewDataRequest(DataRequestType requestType, string email, string? details)
    {
        if (!Enum.IsDefined(typeof(DataRequestType), requestType))
        {
            throw new ArgumentException("Invalid data request type.", nameof(requestType));
        }
        return new DataRequest(requestType, email, details);
    }
}