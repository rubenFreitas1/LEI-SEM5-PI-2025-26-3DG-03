using DataModel.Model;
using DataModel.Repository;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;

namespace WebApi.IntegrationTests.Helpers;

public static class Utilities
{
    public static void InitializeDbForTests(ShippingManagementContext db)
    {
        db.VesselTypes.AddRange(GetSeedingVesselTypesDataModel());
        db.Qualifications.AddRange(GetSeedingQualificationsDataModel());
        db.SaveChanges();
    }

    public static void ReinitializeDbForTests(ShippingManagementContext db)
    {
        db.VesselTypes.RemoveRange(db.VesselTypes);
        db.Qualifications.RemoveRange(db.Qualifications);
        InitializeDbForTests(db);
    }

    public static List<VesselTypeDataModel> GetSeedingVesselTypesDataModel()
    {
        return new List<VesselTypeDataModel>()
        {
            new VesselTypeDataModel(new VesselType("Teste1", "DescriptionTeste1", 100, 5,5,5)),
            new VesselTypeDataModel(new VesselType("Teste2", "DescriptionTeste2", 200, 10,10,10)),
            new VesselTypeDataModel(new VesselType("Teste3", "DescriptionTeste3", 300, 15,15,15))
        };
    }

    public static List<QualificationDataModel> GetSeedingQualificationsDataModel()
    {
        return new List<QualificationDataModel>()
        {
            new QualificationDataModel(new Qualification("QUAL1", "First Qualification", "Description for first qualification test")),
            new QualificationDataModel(new Qualification("QUAL2", "Second Qualification", "Description for second qualification test"))
        };
    }
}