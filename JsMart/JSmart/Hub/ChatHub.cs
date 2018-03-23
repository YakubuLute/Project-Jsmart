using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

using JWYPE.Utilities;
using System.Runtime.Remoting.Contexts;
using System.Threading.Tasks;

namespace JWYPE
{
    public class ChatHub : Hub
    {
        public static List<_Users> Users = new List<_Users>(); 
        public static List<_Messages> Messages = new List<_Messages>(); 
        public static List<_Groups> groupList = new List<_Groups>(); 

       
        public void Connect(string username) 
        {
            var id = Context.ConnectionId;

            if (groupList.Count == 0)
            {
                InitGroup();
            }

            if (Users.Count(x => x.ConnectionId == id) == 0)
            {
                Users.Add(new _Users { ConnectionId = id, Username = username });
                Clients.Caller.onConnected(id, username, Users, Messages, groupList);
                Clients.AllExcept(id).onNewUserConnected(id, username);
                System.Diagnostics.Debug.WriteLine("A User Connected");
            }
        }

        // Group Connect
        public void Connect(string connectionId, string groupname) // 
        {
            Groups.Add(connectionId, groupname);
            System.Diagnostics.Debug.WriteLine(connectionId + " join group - " + groupname);
        }

        // Send Group Message
        public void SendBroadcastMessage(string groupname, string username, string message, long timestamp) // 
        {
            Clients.Group(groupname).broadcastMessage(username, message, timestamp);
            int groupid = 0;
            for (int i = 0; i < groupList.Count; i++) { if (groupname == groupList[i].groupname) { groupid = groupList[i].groupid; } }
            Clients.Group(groupname).messageReceived(groupid, groupname, username, message, timestamp);
            System.Diagnostics.Debug.WriteLine("Message Broadcasted to the Group " + groupname + " Successfully");
        }

        public void SendBroadcastMessage(string username, string message, long timestamp) // 
        {
            StoreMessageToCache(username, message, timestamp);
            Clients.All.messageReceived("", "", username, message, timestamp);
            System.Diagnostics.Debug.WriteLine("Message Broadcasted Successfully");
        }

        public void SendPrivateMessage(string receiverid, string message, long timestamp) // 
        {
            string senderid = Context.ConnectionId;

            var receiver = Users.FirstOrDefault(x => x.ConnectionId == receiverid);
            var sender = Users.FirstOrDefault(x => x.ConnectionId == senderid);

            if (receiver != null && sender != null)
            {
                Clients.Client(receiverid).sendPrivateMessage(senderid, sender.Username, message, timestamp);
                Clients.Caller.sendPrivateMessage(receiverid, sender.Username, message, timestamp);
                System.Diagnostics.Debug.WriteLine("Private Message Sent Successfully");
            }
        }

        public void InitGroup() // Initialise all groups
        {
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "ADMINISTRATOR" });
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "STUDENTS" });
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "CLASS REP'S" });
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "DEPARTMENT HEADS" });
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "COLLEDGE HEADS" });
            groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "LECTURES" });
            //groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "RDT" });
            //groupList.Add(new _Groups { groupid = groupList.Count + 1, groupname = "" });
        }

        public void StoreMessageToCache(string username, string message, long timestamp) // Store the chat history in cache
        {
            Messages.Add(new _Messages { Username = username, Message = message, Timestamp = timestamp });

            if (Messages.Count > 500)
            {
                Messages.RemoveAt(0);
            }
        }
        
        //edited
        // For example: in a chat application, mark the user as offline,
        // delete the association between the current connection id and user name.
        
                public override Task OnDisconnected(bool stopCalled) // 
                {
                    var item = Users.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);

                    if (item != null)
                    {
                        Users.Remove(item);
                        var id = Context.ConnectionId;
                        Clients.All.onUserDisconnected(id, item.Username);
                    }

                    return base.OnDisconnected(stopCalled);
                }
       
               
        public override Task OnReconnected()
        {
            // Add your own code here.
            // For example: in a chat application, you might have marked the
            // user as offline after a period of inactivity; in that case
            // mark the user as online again.
            System.Diagnostics.Debug.WriteLine("A new user has connected Successfully");
            return base.OnReconnected();
        }
        
        public void Hello()
        {
            Clients.All.hello();
        }
    }
}
    