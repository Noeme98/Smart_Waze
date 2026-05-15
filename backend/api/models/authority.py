from django.db import models
from django.contrib.auth.hashers import check_password


class Authority(models.Model):
    authority_name = models.TextField(max_length=64)
    email = models.EmailField(max_length=64)
    password = models.TextField(max_length=128)  # Hashed password
    
    class Meta:
        db_table = 'authorities'
        verbose_name = "Authority"
        verbose_name_plural = "Authorities"
    
    def __str__(self):
        return f"{self.authority_name} ({self.email})"
    
    def check_password(self, raw_password):
        """
        Verify a raw password against the hashed password.
        
        Args:
            raw_password (str): The plain text password to check
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password(raw_password, self.password)