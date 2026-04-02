const db = require("./db");

const userData = [
  { firstname: "Irita", lastname: "Yong", email: "idymott0@huffingtonpost.com", password: "qQ6%O|G}O~", role: "member" },
  { firstname: "Lucien", lastname: "Chan", email: "lhillhouse1@wunderground.com", password: "xZ9\"+MitZ", role: "member" },
  { firstname: "Elita", lastname: "Swift", email: "echillcot2@privacy.gov.au", password: "tS6,<s@+", role: "member" },
  { firstname: "Alayne", lastname: "Gomez", email: "ahardaway3@xing.com", password: "bS5+XiJpM", role: "member" },
  { firstname: "Fifine", lastname: "Chai", email: "fjerrold4@wiley.com", password: "kI3`3gOLIqD.=", role: "member" },
  { firstname: "Virgie", lastname: "Tan", email: "vbenjafield5@ebay.com", password: "nE8*(yX?Ofg\\s", role: "member" },
  { firstname: "Bogey", lastname: "Chin", email: "blaurencot6@ucsd.edu", password: "fO1!Y<#u*bcoOf", role: "member" },
  { firstname: "Violette", lastname: "Wong", email: "vguisby7@bigcartel.com", password: "rB1@/Q/kykW", role: "member" },
  { firstname: "Vanessa", lastname: "Lai", email: "vfeilden8@businessinsider.com", password: "lS9,c\"+V", role: "member" },
  { firstname: "Laughton", lastname: "Smift", email: "ldebischop9@blog.com", password: "nW3=F+mAts", role: "member" }
];

(async () => {
  try {
    console.log(userData);

    const sql = `
      INSERT INTO user (firstname, lastname, email, password, role)
      VALUES ?
    `;

    const values = userData.map(user => [
      user.firstname,
      user.lastname,
      user.email,
      user.password,
      user.role
    ]);

   const [result] = await db.pool.query(sql, [values]);
    console.log(`✅ Successfully inserted ${result.affectedRows} users!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting users:", err);
    process.exit(1);
  }
})();