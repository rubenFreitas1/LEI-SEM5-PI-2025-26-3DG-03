namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;

public class SystemUserMapper
{
    private readonly ISystemUserFactory _systemUserFactory;

    public SystemUserMapper(ISystemUserFactory systemUserFactory)
    {
        _systemUserFactory = systemUserFactory;
    }

    public SystemUser ToDomain(SystemUserDataModel systemUserDataModel)
    {
        SystemUser systemUserDomain = _systemUserFactory.NewSystemUser(
            systemUserDataModel.Code!,
            systemUserDataModel.Username!,
            systemUserDataModel.Email!,
            Enum.Parse<SystemRole>(systemUserDataModel.Role!)
        );
        systemUserDomain.Id = systemUserDataModel.Id;
        var parsedStatus = Enum.Parse<SystemUserStatus>(systemUserDataModel.Status!);
        systemUserDomain.ChangeUserStatus(parsedStatus);
        systemUserDomain.ChangeBooleanIsFirstTime(systemUserDataModel.IsFirstTime);
        if (systemUserDataModel.AcceptedCurrentPrivacyPolicy)
        {
            systemUserDomain.AcceptPrivacyPolicy();
        }
        return systemUserDomain;
    }

    public IEnumerable<SystemUser> ToDomain(IEnumerable<SystemUserDataModel> systemUserDataModels)
    {
        List<SystemUser> systemUsersDomain = new List<SystemUser>();

        foreach (SystemUserDataModel systemUserDataModel in systemUserDataModels)
        {
            SystemUser systemUser = ToDomain(systemUserDataModel);
            systemUsersDomain.Add(systemUser);
        }
        return systemUsersDomain.AsEnumerable();
    }

    public SystemUserDataModel ToDataModel(SystemUser systemUser)
    {
        SystemUserDataModel systemUserDM = new SystemUserDataModel(systemUser);
        return systemUserDM;
    }

    public void UpdateDataModelAsync(SystemUserDataModel systemUserDataModel, SystemUser systemUser)
    {
        systemUserDataModel.Code = systemUser.Code;
        systemUserDataModel.Username = systemUser.Username;
        systemUserDataModel.Email = systemUser.Email;
        systemUserDataModel.Role = systemUser.Role.ToString();
        systemUserDataModel.IsFirstTime = systemUser.IsFirstTime;
        systemUserDataModel.Status = systemUser.Status.ToString();
        systemUserDataModel.AcceptedCurrentPrivacyPolicy = systemUser.AcceptedCurrentPrivacyPolicy;
    }

}