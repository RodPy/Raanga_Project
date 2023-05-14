from django.shortcuts import render, redirect
from django.contrib import messages,auth
from .forms import RegistrationsForms
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.core.mail import EmailMessage
from .models import Account
# Create your views here.

def register (request):
    form = RegistrationsForms
    if request.method == 'POST':
        form= RegistrationsForms(request.POST)
        if form.is_valid():
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            phone_number = form.cleaned_data['phone_number']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            username= email.split("@")[0]
            user =Account.objects.create_user(
                first_name=first_name,
                last_name=last_name,
                email=email,
                username=username,
                password=password)
            user.phone_number =phone_number
            user.save()
            
            #Mensaje de activacion por email
            current_site= get_current_site(request)
            mail_subjet = "Favor activa tu cuenta en RAANGA"
            body = render_to_string('accounts/account_verification_email.html', {
                'user': user,
                'domain':current_site,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            })
            to_email = email
            send_email = EmailMessage(mail_subjet, body, to=[to_email])
            send_email.send()
            
            messages.success(request,'Se registro el usuario exitosamente')
            
            # return redirect('accounts/login/?command=verification&email='+email)
            return redirect('register')

    context={
        'form': form
    }
    return render(request,'accounts/register.html',context)

def login(request):
    if request.method == "POST":
        email =request.POST['email']
        password =request.POST['password']

        user = auth.authenticate(email=email, password=password)

        if user is not None:
            auth.login(request,user)
            return redirect('home')    
        else:
            messages.error(request, 'Las credenciales son incorrectas')
            return redirect('login')
    

    return render(request,'accounts/login.html')


@login_required(login_url='login')
def logout(request):
    auth.logout(request)
    messages.success(request, 'Has salido de sesion')

    return redirect('login')


def activate(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = Account._default_manager.get(pk=uid)
    except(TypeError, ValueError, OverflowError,Account.DoesNotExist):
        user= None

    if user is not None and default_token_generator.check_token(user,token):
        user.is_active = True
        user.save()
        messages.success(request,"Felicidades tu cuenta esta activada")
        return redirect ('login')
    else:
        messages.error(request,"La activacion es invalida")
        return redirect('register')
