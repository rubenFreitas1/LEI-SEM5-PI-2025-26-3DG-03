namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;
using Microsoft.EntityFrameworkCore;


public class RepresentativeMapper
{
    private IRepresentativeFactory _representativeFactory;

    public RepresentativeMapper(IRepresentativeFactory representativeFactory)
    {
        _representativeFactory = representativeFactory;
    }

    public Representative ToDomain(RepresentativeDataModel representativeDM)
    {
        Representative representativeDomain = _representativeFactory.NewRepresentative(
            representativeDM.Name!,
            representativeDM.CitizenId!,
            representativeDM.Nationality!,
            representativeDM.Email!,
            representativeDM.PhoneNumber!);
        representativeDomain.Id = representativeDM.Id;
        representativeDomain.LastModifiedAt = representativeDM.LastModifiedAt;
        return representativeDomain;
    }

    public IEnumerable<Representative> ToDomain(IEnumerable<RepresentativeDataModel> representativeDataModels)
    {
        List<Representative> representativesDomain = new List<Representative>();

        foreach (RepresentativeDataModel representativeDataModel in representativeDataModels)
        {
            Representative representativeDomain = ToDomain(representativeDataModel);
            representativesDomain.Add(representativeDomain);
        }
        return representativesDomain.AsEnumerable();
    }

    public RepresentativeDataModel ToDataModel(Representative representative)
    {
        RepresentativeDataModel representativeDataModel = new RepresentativeDataModel(representative);
        representativeDataModel.LastModifiedAt = representative.LastModifiedAt;
        return representativeDataModel;
    }

    public async Task UpdateDataModelAsync(RepresentativeDataModel representativeDM, Representative representative, DbContext context)
    {
        representativeDM.Name = representative.Name;
        representativeDM.CitizenId = representative.CitizenId;
        representativeDM.Nationality = representative.Nationality;
        representativeDM.Email = representative.Email;
        representativeDM.PhoneNumber = representative.PhoneNumber;
        representativeDM.LastModifiedAt = representative.LastModifiedAt;


        //tirar isto quando meter o await do organization
        await Task.CompletedTask;
    }
}