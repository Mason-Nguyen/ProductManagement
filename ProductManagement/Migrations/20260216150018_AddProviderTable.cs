using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    ProviderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxIdentification = table.Column<string>(type: "varchar(255)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(255)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "varchar(255)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$YH00Mf8sagJs/6nSGDYfvuM5m05Xqh5YhUEUKqtQkGj6T4Np17phS");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$HuEaCZI1ZH0fi6zbJi6kMe.gKlX8llG.sRzT5jnNvYPcBbEko26Zi");
        }
    }
}
