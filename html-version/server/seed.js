const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");
const uid = () => crypto.randomUUID();

console.log("Seeding M-Chama database...");

const adminId = uid();
const memberId = uid();

const insertUser = db.prepare("INSERT OR IGNORE INTO users (id,email,password_hash) VALUES (?,?,?)");
const insertProfile = db.prepare("INSERT OR IGNORE INTO profiles (user_id,full_name,phone,is_approved) VALUES (?,?,?,1)");
const insertRole = db.prepare("INSERT OR IGNORE INTO user_roles (id,user_id,role) VALUES (?,?,?)");
const insertWallet = db.prepare("INSERT OR IGNORE INTO wallets (id,user_id,balance,total_contributed) VALUES (?,?,?,?)");

insertUser.run(adminId, "admin@mchama.test", bcrypt.hashSync("admin1234", 10));
insertProfile.run(adminId, "Admin User", "+254700000001");
insertRole.run(uid(), adminId, "admin");
insertWallet.run(uid(), adminId, 50000, 50000);

insertUser.run(memberId, "member@mchama.test", bcrypt.hashSync("member1234", 10));
insertProfile.run(memberId, "Jane Mwangi", "+254700000002");
insertRole.run(uid(), memberId, "member");
insertWallet.run(uid(), memberId, 12000, 12000);

const chamaId = uid();
db.prepare("INSERT OR IGNORE INTO chamas (id,name,description,contribution_amount,total_savings,created_by) VALUES (?,?,?,?,?,?)")
  .run(chamaId, "Wakulima Sacco", "Farmers savings group", 2000, 84000, adminId);
db.prepare("INSERT OR IGNORE INTO chama_members (id,user_id,chama_id) VALUES (?,?,?)").run(uid(), adminId, chamaId);
db.prepare("INSERT OR IGNORE INTO chama_members (id,user_id,chama_id) VALUES (?,?,?)").run(uid(), memberId, chamaId);

db.prepare("INSERT INTO contributions (id,user_id,chama_id,amount,status) VALUES (?,?,?,?,?)").run(uid(), memberId, chamaId, 2000, "paid");
db.prepare("INSERT INTO contributions (id,user_id,chama_id,amount,status) VALUES (?,?,?,?,?)").run(uid(), memberId, chamaId, 2000, "pending");

db.prepare("INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)")
  .run(uid(), memberId, "Welcome to M-Chama", "Your account is approved. Start contributing today!", "success");

console.log("Done.");
console.log("Admin:  admin@mchama.test / admin1234");
console.log("Member: member@mchama.test / member1234");
