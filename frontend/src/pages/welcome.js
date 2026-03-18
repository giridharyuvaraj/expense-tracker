import { Link } from 'react-router-dom';
import '../assets/styles/welcome.css';
import Logo from '../components/utils/Logo';

function Welcome() {
    return (
        <section className="hero-section">
            <div className="welcome-content">
                
                <Logo />

                <h1 className="welcome-title">
                    Take Control of Your <span>Finances</span>
                </h1>

                <p className="welcome-subtitle">
                    MyWallet helps you track your income, expenses, and savings with ease.
                    Visualize your spending, set goals, and unlock a brighter financial future.
                    <br />
                    <strong>Simple. Secure. Empowering.</strong>
                </p>

                <div className="welcome-actions">
                    <Link to="/auth/login">
                        <button className="login-btn">Sign In</button>
                    </Link>

                    <Link to="/auth/register">
                        <button className="register-btn">Get Started</button>
                    </Link>
                </div>

            </div>
        </section>
    );
}

export default Welcome;