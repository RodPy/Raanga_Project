from django.db import models
from category.models import Category
from django.urls import reverse
from accounts.models import Account
from django.db.models import Avg,Count
from djrichtextfield.models import RichTextField
from ckeditor.fields import RichTextField

# Create your models here.

class Product(models.Model):
    PRODUCT_TYPES = [
        ("G", "Glasses"),
        ("C", "Collar"),
        ("O", "Other"),
    ]
    product_name= models.CharField(max_length=200, unique=True)
    slug = models.CharField(max_length=200, unique=True)
    description= models.TextField(max_length=500, blank=True)
    descriptions = RichTextField(max_length=2000, null=True)
    price= models.IntegerField()
    images= models.ImageField(upload_to='photos/products')
    stock= models.IntegerField()
    is_available= models.BooleanField(default=True)
    model3d_url= models.CharField(max_length=200)
    product_type= models.CharField(max_length=2, choices=PRODUCT_TYPES, default="O")
    model_offset_x= models.FloatField(default=0.0)
    model_offset_y= models.FloatField(default=0.0)
    model_offset_z= models.FloatField(default=0.0)
    model_scale_multiplier= models.FloatField(default=1.0)

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    create_date= models.DateTimeField(auto_now_add=True)
    modified_date= models.DateTimeField(auto_now=True)

    def has_model(self):
        if len(self.model3d_url) == 0:
            return False
        return True
    
    def get_url(self):
        return reverse('product_detail',args=[self.category.slug, self.slug])

    def __str__(self) :
        return self.product_name
    
    def averageReview(self):
        review =ReviewRating.objects.filter(product=self, status= True).aggregate(average=Avg('rating'))
        avg =0
        if review['average'] is not None:
            avg = float (review['average'])
        return avg
    
    def countReview(self):
        review= ReviewRating.objects.filter(product=self, status =True).aggregate(count=Count('id'))
        if review['count'] is not None:
            count = int (review['count'])
        return count

class VariationManager(models.Manager):
    def colors(self):
        return super(VariationManager, self).filter(variation_category='color', is_active=True)

    def tallas(self):
        return super(VariationManager, self).filter(variation_category='talla', is_active=True)

variation_category_choice = (
    ('color', 'color'),
    ('talla', 'talla'),
)

class Variation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation_category = models.CharField(max_length=100, choices=variation_category_choice)
    variation_value = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now=True)

    objects = VariationManager()

    def __str__(self):
        return  self.variation_category + ' : ' +self.variation_value



class ReviewRating(models.Model):
    product= models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100, blank=True)
    review = models.CharField(max_length=500, blank=True) 
    rating = models.FloatField()
    ip = models.CharField(max_length=20, blank=True)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject
