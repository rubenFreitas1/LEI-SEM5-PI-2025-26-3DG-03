using DataModel.Model;
using Domain.Factory;
using ShippingManagement.Domain.Qualifications;

namespace DataModel.Mapper;

public class QualificationMapper
{
    private readonly IQualificationFactory _qualificationFactory;

    public QualificationMapper(IQualificationFactory qualificationFactory)
    {
        _qualificationFactory = qualificationFactory;
    }

    public Qualification ToDomain(QualificationDataModel dm)
    {
        var q = _qualificationFactory.NewQualification(dm.Code!, dm.Name!, dm.Description);
        q.Id = dm.Id;
        return q;
    }

    public IEnumerable<Qualification> ToDomain(IEnumerable<QualificationDataModel> dms)
    {
        var list = new List<Qualification>();
        foreach (var dm in dms)
            list.Add(ToDomain(dm));
        return list.AsEnumerable();
    }

    public QualificationDataModel ToDataModel(Qualification q)
    {
        return new QualificationDataModel(q);
    }

    public void UpdateDataModel(QualificationDataModel dm, Qualification q)
    {
        dm.Name = q.Name;
        dm.Description = q.Description;
    }
}
