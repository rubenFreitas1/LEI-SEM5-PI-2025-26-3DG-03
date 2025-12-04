using System.Data.Common;
using DataModel.Model;
using DataModel.Repository;
using Domain.Model;


namespace WebApi.IntegrationTests.Helpers;

public static class Utilities
{
    public static void InitializeDbForTests(OEMContext db)
    {
        db.Database.EnsureCreated();

        db.IncidentTypes.AddRange(GetSeedingIncidentTypesParents());
        db.SaveChanges();

        db.IncidentTypes.AddRange(GetSeedingIncidentTypesChildren(db));
        db.SaveChanges();

        db.OperationPlans.AddRange(GetSeedingOperationPlans());
        db.SaveChanges();
    }

    public static void ReinitializeDbForTests(OEMContext db)
    {
        db.Database.EnsureCreated();
        db.OperationPlans.RemoveRange(db.OperationPlans);
        db.IncidentTypes.RemoveRange(db.IncidentTypes);


        db.SaveChanges();
        InitializeDbForTests(db);
    }




     public static List<IncidentTypeDataModel> GetSeedingIncidentTypesParents()
    {
        var incidentTypes = new List<IncidentTypeDataModel>
        {
            new IncidentTypeDataModel
            {
                Code = "ENV-COND",
                Name = "Environmental Conditions",
                Description = "Environmental Conditions related incident",
                Classification = IncidentClassification.Major
            },
            new IncidentTypeDataModel
            {
                Code = "OPR-FAIL",
                Name = "Operational Failures",
                Description = "Operational Failures related incident",
                Classification = IncidentClassification.Major
            },
            new IncidentTypeDataModel
            {
                Code = "SEC-EVT",
                Name = "Security Events",
                Description = "Security Events related incident",
                Classification = IncidentClassification.Critical
            }
        };

        return incidentTypes;
    }

    public static List<IncidentTypeDataModel> GetSeedingIncidentTypesChildren(OEMContext context)
    {
        var parent1 = context.IncidentTypes.First(it => it.Code == "ENV-COND");
        var parent2 = context.IncidentTypes.First(it => it.Code == "OPR-FAIL");
        var parent3 = context.IncidentTypes.First(it => it.Code == "SEC-EVT");
        var incidentTypes = new List<IncidentTypeDataModel>
        {
            new IncidentTypeDataModel
            {
                Code = "FOG",
                Name = "Fog",
                Description = "Incidents related to fog conditions",
                Classification = IncidentClassification.Minor,
                ParentIncidentTypeId = parent1.Id
            },
            new IncidentTypeDataModel
            {
                Code = "CRANE-MALF",
                Name = "Crane Malfunctions",
                Description = "Incidents related to crane malfunctions",
                Classification = IncidentClassification.Major,
                ParentIncidentTypeId = parent2.Id
            },
            new IncidentTypeDataModel
            {
                Code = "SEC-BREACH",
                Name = "Security Breaches",
                Description = "Incidents related to unauthorized access or security breaches",
                Classification = IncidentClassification.Critical,
                ParentIncidentTypeId = parent3.Id
            }
        };
        return incidentTypes;
    }

    public static List<DataModel.Model.OperationPlanDataModel> GetSeedingOperationPlans()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var dayAfterTomorrow = today.AddDays(2);

        var operationPlans = new List<DataModel.Model.OperationPlanDataModel>
        {
            new DataModel.Model.OperationPlanDataModel
            {
                TargetDay = today,
                Author = "Admin User",
                Algorithm = "Greedy Algorithm",
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                LastModifiedAt = DateTime.UtcNow.AddHours(-2),
                OperationList = new List<DataModel.Model.OperationEntryDataModel>
                {
                    new DataModel.Model.OperationEntryDataModel
                    {
                        VesselName = "Vessel Alpha",
                        ArrivalTime = DateTime.UtcNow.AddHours(1),
                        DepartureTime = DateTime.UtcNow.AddHours(5),
                        Cranes = new List<string> { "Crane A1", "Crane A2" },
                        StaffMembers = new List<string> { "Staff1", "Staff2", "Staff3" }
                    },
                    new DataModel.Model.OperationEntryDataModel
                    {
                        VesselName = "Vessel Beta",
                        ArrivalTime = DateTime.UtcNow.AddHours(6),
                        DepartureTime = DateTime.UtcNow.AddHours(10),
                        Cranes = new List<string> { "Crane B1" },
                        StaffMembers = new List<string> { "Staff4", "Staff5" }
                    }
                }
            },
            new DataModel.Model.OperationPlanDataModel
            {
                TargetDay = tomorrow,
                Author = "Admin User",
                Algorithm = "Heuristic Algorithm",
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                LastModifiedAt = DateTime.UtcNow.AddHours(-1),
                OperationList = new List<DataModel.Model.OperationEntryDataModel>
                {
                    new DataModel.Model.OperationEntryDataModel
                    {
                        VesselName = "Vessel Gamma",
                        ArrivalTime = tomorrow.AddHours(8),
                        DepartureTime = tomorrow.AddHours(12),
                        Cranes = new List<string> { "Crane C1", "Crane C2" },
                        StaffMembers = new List<string> { "Staff6", "Staff7" }
                    }
                }
            },
            new DataModel.Model.OperationPlanDataModel
            {
                TargetDay = dayAfterTomorrow,
                Author = "Planner User",
                Algorithm = "Greedy Algorithm",
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow,
                OperationList = new List<DataModel.Model.OperationEntryDataModel>
                {
                    new DataModel.Model.OperationEntryDataModel
                    {
                        VesselName = "Vessel Delta",
                        ArrivalTime = dayAfterTomorrow.AddHours(9),
                        DepartureTime = dayAfterTomorrow.AddHours(14),
                        Cranes = new List<string> { "Crane D1" },
                        StaffMembers = new List<string> { "Staff8", "Staff9", "Staff10" }
                    }
                }
            }
        };

        return operationPlans;
    }
}