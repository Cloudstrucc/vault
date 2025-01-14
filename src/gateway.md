## Download and install a standard gateway

Because the gateway runs on the computer that you install it on, be
sure to install it on a computer that's always turned on. For better
performance and reliability, we recommend that the computer is on a
wired network rather than a wireless one.

1. [Download the standard gateway](https://go.microsoft.com/fwlink/?LinkId=2116849&clcid=0x409).

   If the on-premises data gateway (standard mode) requires access to remote data source in a different domain, it must be installed on a
   domain joined machine having a trust relationship with the target
   domain.
2. **In the gateway installer, keep the default installation path, accept the terms of use, and then select Install .**
   **![Installing to the default installation path.](https://learn.microsoft.com/en-us/data-integration/gateway/media/service-gateway-install/install-path.png)
3. **Enter the email address** for your Office 365 organization account, and then select  **Sign in** .
   **![Entering your email address.](https://learn.microsoft.com/en-us/data-integration/gateway/media/service-gateway-install/email-address.png)

   You need to sign in with your work account or a school account. This account is an  *organization's **work** account* .

   If you signed up for an Office 365 offering and didn't supply your work email address, your address might look like nancy@contoso.onmicrosoft.com. Your account is stored within a tenant in Microsoft Entra ID.

   The gateway is associated with your Office 365 organization account. You manage gateways from within the associated service.
   You're now signed in to your account.
4. **Select Register a new gateway on this computer** >  **Next** .

   **![Registering the gateway.](https://learn.microsoft.com/en-us/data-integration/gateway/media/service-gateway-install/register-gateway.png)
5. **Enter a name for the gateway.** The name must be unique across the
   tenant. Also enter a recovery key. You'll need this key if you ever want
   to recover or move your gateway. Select  **Configure** .
   **![Configuring the gateway.](https://learn.microsoft.com/en-us/data-integration/gateway/media/service-gateway-install/configure-gateway.png)

   The agency is responsible for keeping the gateway recovery key in a safe place where it can be retrieved later. Microsoft doesn't have access to
   this key and it can't be retrieved by us. Note the **Add to an existing gateway cluster** checkbox. We'll use this checkbox in the next section of this article.
   Also note that you can change the region that connects the gateway to cloud services. For more information, go to [Set the data center region](https://learn.microsoft.com/en-us/data-integration/gateway/service-gateway-data-region).
6. **Review the information in the final window.** The example below uses the same account for Power BI, Power Apps, and Power Automate, the
   gateway is available for all three services. Select  **Close** .
   **![Gateway summary.](https://learn.microsoft.com/en-us/data-integration/gateway/media/service-gateway-install/summary-screen.png)

Now that you've installed a gateway, you can add another gateway to create a cluster
