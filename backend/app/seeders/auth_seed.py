from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


DEMO_USERS = (
    ("admin", "admin@landiq.demo", "admin123", "system_administrator"),
    ("manager", "manager@landiq.demo", "manager123", "project_manager"),
    ("analyst", "analyst@landiq.demo", "analyst123", "analyst"),
    ("viewer", "viewer@landiq.demo", "viewer123", "viewer"),
)


def seed_demo_users(db: Session) -> None:
    for username, email, password, role in DEMO_USERS:
        user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if not user:
            user = User(username=username, email=email, role=role, hashed_password=hash_password(password))
            db.add(user)
        else:
            user.username = username
            user.email = email
            user.role = role
            user.hashed_password = hash_password(password)
    db.commit()
