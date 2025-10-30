const db = require("./db");

const userData = [
  { firstname: "Irita", lastname: "Yong", email: "idymott0@huffingtonpost.com", password: "qQ6%O|G}O~", role: "member" },
  { firstname: "Lucien", lastname: "Chan", email: "lhillhouse1@wunderground.com", password: "xZ9\"+MitZ", role: "member" },
  { firstname: "Elita", lastname: "Swift", email: "echillcot2@privacy.gov.au", password: "tS6,<s@+", role: "admin" },
  { firstname: "Alayne", lastname: "Gomez", email: "ahardaway3@xing.com", password: "bS5+XiJpM", role: "member" },
  { firstname: "Fifine", lastname: "Chai", email: "fjerrold4@wiley.com", password: "kI3`3gOLIqD.=", role: "member" },
  { firstname: "Virgie", lastname: "Tan", email: "vbenjafield5@ebay.com", password: "nE8*(yX?Ofg\\s", role: "member" },
  { firstname: "Bogey", lastname: "Chin", email: "blaurencot6@ucsd.edu", password: "fO1!Y<#u*bcoOf", role: "member" },
  { firstname: "Violette", lastname: "Wong", email: "vguisby7@bigcartel.com", password: "rB1@/Q/kykW", role: "admin" },
  { firstname: "Vanessa", lastname: "Lai", email: "vfeilden8@businessinsider.com", password: "lS9,c\"+V", role: "member" },
  { firstname: "Laughton", lastname: "Smift", email: "ldebischop9@blog.com", password: "nW3=F+mAts", role: "member" },
  { firstname: "Eunice", lastname: "Bong", email: "ecarmonta@ihg.com", password: "oS0)MWoF9|W", role: "member" },
  { firstname: "Beauregard", lastname: "Brown", email: "bheazelb@cam.ac.uk", password: "sQ8_|MIB_B|y", role: "member" },
  { firstname: "Kale", lastname: "Jones", email: "ktootellc@networksolutions.com", password: "nM1~B&wJc7", role: "member" },
  { firstname: "Lurette", lastname: "Johnson", email: "lcossonsd@sakura.ne.jp", password: "nV5+M/E.TBfnzN(", role: "member" },
  { firstname: "Farris", lastname: "Hill", email: "fdebankee@dmoz.org", password: "mK4.0J7KxLBA{G", role: "member" },
  { firstname: "Mei", lastname: "Ling", email: "mkemstonf@lulu.com", password: "kN0=N#S+tXb", role: "member" },
  { firstname: "Cassondra", lastname: "Miller", email: "ckittredgeg@chronoengine.com", password: "gR4~D'qpx(i_S", role: "member" },
  { firstname: "Marcus", lastname: "Lewis", email: "mcordeyh@geocities.jp", password: "kH1+/38$gk/cL*.k", role: "member" },
  { firstname: "Alexi", lastname: "Corr", email: "alayei@google.ca", password: "dW7%Yawe,/{cf", role: "member" },
  { firstname: "Domenic", lastname: "Watson", email: "dpauluschj@fotki.com", password: "pV0(Y8t=~3N/qT7Q", role: "member" }
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

    const [result] = await db.query(sql, [values]);
    console.log(`✅ Successfully inserted ${result.affectedRows} users!`);
  } catch (err) {
    console.error("❌ Error inserting users:", err);
  } finally {
    db.end();
  }
})();
