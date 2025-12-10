namespace DataModel.Model;

using Domain.Model;

public class SystemUserDataModel
{
    public long Id { get; set; }
    public string? Code { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
    public bool IsFirstTime { get; set; }
    public bool AcceptedCurrentPrivacyPolicy { get; set; }

    public SystemUserDataModel() { }

    public SystemUserDataModel(SystemUser systemUser)
    {
        Id = systemUser.Id;
        Code = systemUser.Code;
        Username = systemUser.Username;
        Email = systemUser.Email;
        Role = systemUser.Role.ToString();
        IsFirstTime = systemUser.IsFirstTime;
        Status = systemUser.Status.ToString();
        AcceptedCurrentPrivacyPolicy = systemUser.AcceptedCurrentPrivacyPolicy;
    }

}