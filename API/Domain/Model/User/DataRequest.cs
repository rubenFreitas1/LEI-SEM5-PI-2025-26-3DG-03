namespace Domain.Model;


public enum DataRequestType
{
    Access,
    Rectification,
    Deletion
}

public enum DataRequestStatus
{
    Pending,
    Completed,
    Rejected
}

public class DataRequest
{
    public long Id { get; set; }

    public DataRequestType RequestType { get; private set; }

    public DateTime RequestedAt { get; private set; }

    public string? Details { get; private set; }

    public DataRequestStatus Status { get;  set; }

    public string SystemUserEmail { get; private set; } = string.Empty;
    private DataRequest() { }

    public DataRequest(DataRequestType requestType,  string systemUserEmail, string? details)
    {
        SystemUserEmail = validateSystemUserEmail(systemUserEmail);
        Details = validateDetails(details);
        RequestType = requestType;
        RequestedAt = DateTime.UtcNow;
        Status = DataRequestStatus.Pending;
    }

    // Constructor used when rehydrating from persistent storage to preserve the original RequestedAt
    public DataRequest(DataRequestType requestType, string systemUserEmail, string? details, DateTime requestedAt)
    {
        SystemUserEmail = validateSystemUserEmail(systemUserEmail);
        Details = validateDetails(details);
        RequestType = requestType;
        RequestedAt = requestedAt;
        Status = DataRequestStatus.Pending;
    }

    public string validateSystemUserEmail(string systemUserEmail)
    {
        if (string.IsNullOrWhiteSpace(systemUserEmail))
        {
            throw new ArgumentException("System user email cannot be null or empty.", nameof(systemUserEmail));
        }
        
        systemUserEmail = systemUserEmail.Trim();
        
        if (!systemUserEmail.Contains("@") || systemUserEmail.IndexOf("@") == 0 || systemUserEmail.IndexOf("@") == systemUserEmail.Length - 1)
        {
            throw new ArgumentException("System user email is not valid.", nameof(systemUserEmail));
        }
        
        return systemUserEmail;
    }

    public string? validateDetails(string? details)
    {
        if (string.IsNullOrWhiteSpace(details))
        {
            return details; // Return null or empty as-is
        }
        
        details = details.Trim();
        
        if (details.Length > 500)
        {
            throw new ArgumentException("Details cannot exceed 500 characters.", nameof(details));
        }
        
        return details;
    }

}