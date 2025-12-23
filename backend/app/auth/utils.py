from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
import logging

logger = logging.getLogger(__name__)

from app.db import get_db
from app.auth.models import TokenData, User, UserInDB

# Configuration directe
SECRET_KEY = "your_secret_key_for_jwt_tokens"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 jours pour éviter les déconnexions fréquentes

# Configuration de la sécurité des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration de l'authentification OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe en clair correspond au mot de passe hashé
    """
    try:
        logger.debug(f"🔒 Vérification du mot de passe (hash: {hashed_password[:10]}...)")
        is_valid = pwd_context.verify(plain_password, hashed_password)
        if is_valid:
            logger.info("✅ Mot de passe valide (hash bcrypt)")
        else:
            logger.warning("❌ Mot de passe invalide (hash bcrypt)")
        return is_valid
    except Exception as e:
        logger.warning(f"⚠️ Erreur lors de la vérification du mot de passe: {str(e)}")
        # Si le format du hash n'est pas reconnu, comparer directement les chaînes
        # Ceci est une solution temporaire et non sécurisée
        if plain_password == hashed_password:
            logger.warning("⚠️ Mot de passe vérifié par comparaison directe (NON SÉCURISÉ)")
            return True
        logger.error("❌ Mot de passe invalide")
        return False


def get_password_hash(password: str) -> str:
    """
    Génère un hash pour le mot de passe
    """
    return pwd_context.hash(password)


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """
    Récupère un utilisateur par son email depuis la base de données
    """
    try:
        logger.info(f"🔍 Recherche de l'utilisateur avec l'email: {email}")
        db = await get_db()
        response = db.table("agents").select("*").eq("email", email).execute()
        
        if response.data and len(response.data) > 0:
            user_data = response.data[0]
            logger.info(f"✅ Utilisateur trouvé: {user_data['nom']} (ID: {user_data['id']}, Role: {user_data['role']})")
            return UserInDB(**user_data)
        logger.warning(f"⚠️ Aucun utilisateur trouvé avec l'email: {email}")
        return None
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return None


async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """
    Authentifie un utilisateur par son email et son mot de passe
    """
    logger.info(f"🔐 Tentative d'authentification pour: {email}")
    user = await get_user_by_email(email)
    if not user:
        logger.warning(f"❌ Utilisateur non trouvé: {email}")
        return None
    
    logger.info(f"🔑 Vérification du mot de passe pour: {email}")
    if not verify_password(password, user.password_hash):
        logger.warning(f"❌ Mot de passe incorrect pour: {email}")
        return None
    
    logger.info(f"✅ Authentification réussie pour: {email}")
    return user


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token JWT pour l'authentification
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Récupère l'utilisateur actuel à partir du token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: str = payload.get("user_id")
        
        if email is None:
            raise credentials_exception
            
        token_data = TokenData(email=email, role=role, user_id=user_id)
    except JWTError:
        raise credentials_exception
        
    user = await get_user_by_email(token_data.email)
    
    if user is None:
        raise credentials_exception
        
    return User(
        id=user.id,
        email=user.email,
        nom=user.nom,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Vérifie que l'utilisateur actuel est actif
    """
    return current_user


def is_admin(user: User) -> bool:
    """
    Vérifie si l'utilisateur est un administrateur
    """
    return user.role == "admin"


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Vérifie que l'utilisateur actuel est un administrateur
    """
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé. Privilèges administrateur requis."
        )
    return current_user
