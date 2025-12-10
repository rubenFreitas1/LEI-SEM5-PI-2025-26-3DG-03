namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Model;
using Domain.Factory;

public class PrivacyPolicyMapper
{
    private readonly IPrivacyPolicyFactory _privacyPolicyFactory;

    public PrivacyPolicyMapper(IPrivacyPolicyFactory privacyPolicyFactory)
    {
        _privacyPolicyFactory = privacyPolicyFactory;
    }

    public PrivacyPolicy ToDomainModel(PrivacyPolicyDataModel dataModel)
    {
        var privacyPolicy = _privacyPolicyFactory.NewPrivacyPolicy(dataModel.Content!);
        privacyPolicy.Id = dataModel.Id;
        return privacyPolicy;
    }

    public IEnumerable<PrivacyPolicy> ToDomainModel(IEnumerable<PrivacyPolicyDataModel> dataModels)
    {
        var list = new List<PrivacyPolicy>();
        foreach (var dm in dataModels)
            list.Add(ToDomainModel(dm));
        return list.AsEnumerable();
    }

    public PrivacyPolicyDataModel ToDataModel(PrivacyPolicy privacyPolicy)
    {
        return new PrivacyPolicyDataModel(privacyPolicy);
    }

    public void UpdateDataModel(PrivacyPolicyDataModel dataModel, PrivacyPolicy privacyPolicy)
    {
        dataModel.Content = privacyPolicy.Content;
        dataModel.IsCurrent = privacyPolicy.IsCurrent;
    }
}