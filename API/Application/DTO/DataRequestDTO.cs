namespace Application.DTO;
using System.Text.Json.Serialization;

using Domain.Model;

public class DataRequestDTO
{
    public long Id { get; set; }
    public string SystemUserEmail { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DataRequestType RequestType { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DataRequestStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public string? Details { get; set; }

    public DataRequestDTO() { }

    public DataRequestDTO(long id, string systemUserEmail, DataRequestType requestType, DataRequestStatus status, DateTime requestedAt, string? details)
    {
        Id = id;
        SystemUserEmail = systemUserEmail;
        RequestType = requestType;
        Status = status;
        RequestedAt = requestedAt;
        Details = details;
    }

    static public DataRequestDTO ToDTO(DataRequest dataRequest)
    {
        try
        {
            DataRequestDTO dto = new DataRequestDTO(dataRequest.Id, dataRequest.SystemUserEmail, dataRequest.RequestType, dataRequest.Status, dataRequest.RequestedAt, dataRequest.Details);
            return dto;
        }
        catch (Exception ex)
        {
            throw new ArgumentException($"Error converting to DataRequestDTO: {ex.Message}");
        }
    }

    static public IEnumerable<DataRequestDTO> ToDTO(IEnumerable<DataRequest> dataRequests)
    {
        List<DataRequestDTO> dataRequestDTOs = new List<DataRequestDTO>();
        foreach (DataRequest dataRequest in dataRequests)
        {
            DataRequestDTO dataRequestDTO = ToDTO(dataRequest);
            dataRequestDTOs.Add(dataRequestDTO);
        }
        return dataRequestDTOs;
    }
}
