import bcrypt from "bcryptjs";

async function verify() {
    const hash = "$2b$12$1Tq3aKgQ3.Nq4jcAkZYeeOFBKXvu2anpnGZCrHwMxypmKZ/.kQ9wO";
    const match = await bcrypt.compare("password", hash);
    console.log("Match:", match);
}

verify();
