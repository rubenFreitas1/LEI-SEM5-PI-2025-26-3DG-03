using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataModel.Migrations
{
    /// <inheritdoc />
    public partial class ChangePrivacyPolicyToBoolean : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastAcceptedPrivacyPolicyAt",
                table: "SystemUsers");

            migrationBuilder.AddColumn<bool>(
                name: "AcceptedCurrentPrivacyPolicy",
                table: "SystemUsers",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedCurrentPrivacyPolicy",
                table: "SystemUsers");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAcceptedPrivacyPolicyAt",
                table: "SystemUsers",
                type: "datetime(6)",
                nullable: true);
        }
    }
}
