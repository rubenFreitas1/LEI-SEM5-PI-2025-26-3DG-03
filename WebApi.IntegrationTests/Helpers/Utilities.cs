using System.Data.Common;
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
        db.SaveChanges();

        db.Qualifications.AddRange(GetSeedingQualificationsDataModel());
        db.SaveChanges();
        var vesselTypes = db.VesselTypes.ToList();
        db.Docks.AddRange(GetSeedingDocksDataModel(vesselTypes));
        db.SaveChanges();

        db.VesselRecords.AddRange(GetSeedingVesselRecordsDataModel(vesselTypes));
        db.SaveChanges();
    }

    public static void ReinitializeDbForTests(ShippingManagementContext db)
    {
        db.VesselTypes.RemoveRange(db.VesselTypes);
        db.Qualifications.RemoveRange(db.Qualifications);
        db.Docks.RemoveRange(db.Docks);
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

    public static List<VesselRecordDataModel> GetSeedingVesselRecordsDataModel(List<VesselTypeDataModel> vesselTypes)
    {
        return new List<VesselRecordDataModel>()
        {
            
            new VesselRecordDataModel
            {
                IMONumber = "9811000",
                VesselName = "Vessel One",
                VesselType = vesselTypes[0],
                Operator = "Operator A"
            },
            new VesselRecordDataModel{
                IMONumber = "9241061",
                VesselName = "Vessel Two",
                VesselType = vesselTypes[1],
                Operator = "Operator B"
            },
            new VesselRecordDataModel
            {
                IMONumber = "9744001",
                VesselName = "Vessel Three",
                VesselType = vesselTypes[2],
                Operator = "Operator C"
            }
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


    public static List<DockDataModel> GetSeedingDocksDataModel(List<VesselTypeDataModel> vesselTypes)
    {
        return new List<DockDataModel>()
        {
            new DockDataModel
            {
                Name = "Dock A",
                Location = "Port 1",
                Length = 500,
                Depth = 30,
                MaxDraft = 15,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1] }
            },
            new DockDataModel
            {
                Name = "Dock B",
                Location = "Port 2",
                Length = 300,
                Depth = 20,
                MaxDraft = 10,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[1], vesselTypes[2] }
            }
        };
    }
}