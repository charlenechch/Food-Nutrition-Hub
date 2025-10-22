router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Get user + profile data
    const [rows] = await db.execute(`
      SELECT u.userID, u.email, u.role,
             up.userProfileID, up.firstname, up.lastname
      FROM user u
      JOIN userProfile up ON u.userID = up.userID
      WHERE u.email = ? AND u.password = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userData = rows[0];

    // ✅ Save to session (IMPORTANT!)
    req.session.user = {
      userID: userData.userID,
      userProfileID: userData.userProfileID,  // ✅ This was missing before
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      role: userData.role || "member"
    };

    console.log("✅ Session saved:", req.session.user);

    return res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
