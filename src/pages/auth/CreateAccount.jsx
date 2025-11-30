import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreateAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const { first_name, middle_name, last_name, username, email, password, confirm_password } = formData;

    if (!first_name || !last_name || !username || !email || !password || !confirm_password) {
      alert("Please fill out all required fields!");
      return;
    }

    if (!email.endsWith("@wmsu.edu.ph")) {
      alert("Only WMSU student email (@wmsu.edu.ph) is allowed.");
      return;
    }

    if (password !== confirm_password) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first_name,
          lastName: last_name,
          username,
          email,
          password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create account");
      }

      alert("Account created successfully! You can now log in.");
      navigate("/login");

    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google Sign-Up failed");

      alert("✅ Google account created! Check your WMSU email for verification.");
      navigate("/verify?email=" + encodeURIComponent(data.user.email));
    } catch (err) {
      console.error("Google Sign-Up Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/wmsu-bg-img.jpg')" }}
    >
      <div className="flex w-[900px] h-[600px] bg-white bg-opacity-95 shadow-2xl rounded-2xl overflow-hidden">
        <div className="w-1/2 bg-maroon flex flex-col justify-center items-center text-white">
          <div className="flex gap-6 mb-4 relative -top-4">
            <img src="/wmsu-logo.jpg" alt="WMSU Logo" className="w-40 h-40 rounded-full object-cover" />
            <img src="/study-squad-logo.png" alt="Study Squad Logo" className="w-40 h-40 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crimsons Study Squad</h1>
        </div>

        <div className="w-1/2 flex flex-col justify-center items-center p-10 overflow-y-auto scrollbar-hide max-h-[700px]">
          <h2 className="text-2xl font-semibold mb-6 text-maroon text-center leading-snug mt-30">
            Make your own account now!
          </h2>

          <form onSubmit={handleCreate} className="w-72 flex flex-col gap-3">
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <input
              type="text"
              name="middle_name"
              placeholder="Middle Name"
              value={formData.middle_name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <input
              type="email"
              name="email"
              placeholder="WMSU Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                placeholder="Confirm Password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-maroon text-white font-medium py-2 rounded hover:brightness-90"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-gray-900 text-sm font-normal text-center">or</p>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSignUp}
                onError={() => alert("Google Sign-Up Failed")}
              />
            </div>

            <p className="text-sm mt-4 text-gray-600 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-maroon font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}