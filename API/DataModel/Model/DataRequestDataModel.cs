namespace DataModel.Model;

using System.ComponentModel.DataAnnotations;

using Domain.Model;

public class DataRequestDataModel
{
    public long Id { get; set; }

    public string RequestType { get; set; } = string.Empty;

    public string RequestStatus { get; set; } = string.Empty;

    public string SystemUserEmail { get; set; } = string.Empty;

    public string? Details { get; set; }

    public DateTime RequestedAt { get; set; }

    public DataRequestDataModel() { }

    public DataRequestDataModel(DataRequest dataRequest)
    {
        Id = dataRequest.Id;
        RequestType = dataRequest.RequestType.ToString();
        RequestStatus = dataRequest.Status.ToString();
        SystemUserEmail = dataRequest.SystemUserEmail;
        Details = dataRequest.Details;
        RequestedAt = dataRequest.RequestedAt;
    }
}