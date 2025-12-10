namespace Domain.Model;

using System.ComponentModel.DataAnnotations;


public enum SystemRole
{
    Admin,
    LogisticOperator,
    PortAuthorityOfficer
}


public enum SystemUserStatus
{
    Active,
    Deactivated
}

public class SystemUser
{
    public long Id { get; set; }

    public string? Code { get; private set; }

    public string? Username { get; private set; }

    public string? Email { get; private set; }

    public SystemRole Role { get; private set; }

    public SystemUserStatus Status { get; private set; }

    public bool IsFirstTime { get; private set; }

    public bool AcceptedCurrentPrivacyPolicy { get; private set; }

    private SystemUser() { }

    public SystemUser(string code, string username, string email, SystemRole role)
    {
        ValidateCode(code);
        ValidateUsername(username);
        ValidateEmail(email);
        Code = code;
        Username = username.Trim();
        Email = email.Trim();
        Role = role;
        Status = SystemUserStatus.Deactivated;
        IsFirstTime = true;
    }



    public void ValidateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new ArgumentException("Username cannot be null or empty.", nameof(username));
        }
        username = username.Trim();
        if (username.Length < 3 || username.Length > 20)
        {
            throw new ArgumentException("Username must be between 3 and 20 characters long.", nameof(username));
        }
    }

    public void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Code cannot be null or empty.", nameof(code));
        }
        if (!System.Text.RegularExpressions.Regex.IsMatch(code, @"^USR\d{4}$"))
        {
            throw new ArgumentException(
                "Code must begin with 'USR' followed by 4 digits (ex.: USR0001).",
                nameof(code)
            );
        }
    }


    public void ValidateEmail(string email)
    {
        var validator = new EmailAddressAttribute();
        if (!validator.IsValid(email))
        {
            throw new ArgumentException("Email format is invalid.", nameof(email));
        }
    }

    public void ChangeBooleanIsFirstTime(bool isFirstTime)
    {
        IsFirstTime = isFirstTime;
    }

    public void ChangeUserStatus(SystemUserStatus status)
    {
        Status = status;
    }


    public void ChangeSystemRole(SystemRole systemRole)
    {
        Role = systemRole;
    }

    public void ChangeUsername(string username)
    {
        ValidateUsername(username);
        Username = username.Trim();
    }

    public void AcceptPrivacyPolicy()
    {
        AcceptedCurrentPrivacyPolicy = true;
    }

    public void ResetPrivacyPolicyAcceptance()
    {
        AcceptedCurrentPrivacyPolicy = false;
    }

}
