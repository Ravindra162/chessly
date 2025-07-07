import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { UserContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from './Loading';
import { getApiUrl, getAuthHeaders, API_CONFIG } from '../config/api';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedChallenges, setReceivedChallenges] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    sendRequest: {},
    acceptRequest: {},
    rejectRequest: {},
    removeFriend: {},
    challengeFriend: {}
  });
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'challenges', 'search'
  const user = useContext(UserContext);
  const socketContext = useContext(SocketContext);
  const socket = socketContext?.socket || socketContext;
  const navigate = useNavigate();

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.FRIENDS), getAuthHeaders());
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to fetch friends');
    }
  };

  // Fetch received friend requests
  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REQUESTS_RECEIVED), getAuthHeaders());
      setFriendRequests(response.data.friendRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast.error('Failed to fetch friend requests');
    }
  };

  // Fetch sent friend requests
  const fetchSentRequests = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REQUESTS_SENT), getAuthHeaders());
      setSentRequests(response.data.friendRequests);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      toast.error('Failed to fetch sent requests');
    }
  };

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_SEARCH)}?username=${encodeURIComponent(query)}`, getAuthHeaders());
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (username) => {
    setLoadingStates(prev => ({
      ...prev,
      sendRequest: { ...prev.sendRequest, [username]: true }
    }));

    try {
      await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_SEND), { receiverUsername: username }, getAuthHeaders());
      toast.success('Friend request sent!');
      // Refresh search results to update status
      searchUsers(searchQuery);
      fetchSentRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(error.response?.data?.msg || 'Failed to send friend request');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        sendRequest: { ...prev.sendRequest, [username]: false }
      }));
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    setLoadingStates(prev => ({
      ...prev,
      acceptRequest: { ...prev.acceptRequest, [requestId]: true }
    }));

    try {
      await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_ACCEPT), { requestId }, getAuthHeaders());
      toast.success('Friend request accepted!');
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        acceptRequest: { ...prev.acceptRequest, [requestId]: false }
      }));
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    setLoadingStates(prev => ({
      ...prev,
      rejectRequest: { ...prev.rejectRequest, [requestId]: true }
    }));

    try {
      await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_REJECT), { requestId }, getAuthHeaders());
      toast.success('Friend request rejected');
      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        rejectRequest: { ...prev.rejectRequest, [requestId]: false }
      }));
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      setLoadingStates(prev => ({
        ...prev,
        removeFriend: { ...prev.removeFriend, [friendId]: true }
      }));

      try {
        await axios.delete(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_REMOVE), {
          ...getAuthHeaders(),
          data: { friendId }
        });
        toast.success('Friend removed');
        fetchFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
        toast.error('Failed to remove friend');
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          removeFriend: { ...prev.removeFriend, [friendId]: false }
        }));
      }
    }
  };

  // Challenge friend to a game (WebSocket-based)
  const challengeFriend = async (friendId, friendUsername) => {
    setLoadingStates(prev => ({
      ...prev,
      challengeFriend: { ...prev.challengeFriend, [friendId]: true }
    }));

    try {
      // First verify friendship via API
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.FRIEND_CHALLENGE), {
        friendId
      }, getAuthHeaders());

      if (response.status === 200) {
        // Send challenge via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'friend_challenge',
            challengerId: user.user.id,
            friendId,
            timeControl: 600,
            challengerUsername: user.user.username
          }));
        } else {
          toast.error('Connection lost. Please refresh and try again.');
        }
      }

    } catch (error) {
      console.error('Error challenging friend:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.msg || 'Cannot challenge this friend');
      } else {
        toast.error('Failed to send challenge');
      }
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        challengeFriend: { ...prev.challengeFriend, [friendId]: false }
      }));
    }
  };

  // Accept a challenge
  const acceptChallenge = (challenge) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'challenge_response',
        challengerId: challenge.challengerId,
        challengedId: user.user.id,
        accepted: true,
        challengeId: challenge.challengeId
      }));
      
      // Remove from received challenges
      setReceivedChallenges(prev => 
        prev.filter(c => c.challengeId !== challenge.challengeId)
      );
    } else {
      toast.error('Connection lost. Please refresh and try again.');
    }
  };

  // Reject a challenge
  const rejectChallenge = (challenge) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'challenge_response',
        challengerId: challenge.challengerId,
        challengedId: user.user.id,
        accepted: false,
        challengeId: challenge.challengeId
      }));
      
      // Remove from received challenges
      setReceivedChallenges(prev => 
        prev.filter(c => c.challengeId !== challenge.challengeId)
      );
      
      toast.success('Challenge declined');
    } else {
      toast.error('Connection lost. Please refresh and try again.');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, []);

  // WebSocket message handling for challenges
  useEffect(() => {
    if (socket && user?.user && socket.readyState === WebSocket.OPEN) {
      const handleMessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          
          if (parsedData.type === 'friend_challenge_received') {
            // Show challenge notification
            setReceivedChallenges(prev => [...prev, {
              challengerId: parsedData.challengerId,
              challengerUsername: parsedData.challengerUsername,
              timeControl: parsedData.timeControl,
              challengeId: parsedData.challengeId,
              createdAt: new Date().toISOString()
            }]);
            
            toast.info(`${parsedData.challengerUsername} challenged you to a game!`);
            
            // Switch to challenges tab to show the notification
            if (activeTab !== 'challenges') {
              setActiveTab('challenges');
            }
          } else if (parsedData.type === 'challenge_sent') {
            toast.success(parsedData.message);
          } else if (parsedData.type === 'challenge_rejected') {
            toast.error(parsedData.message);
          } else if (parsedData.type === 'challenge_error') {
            toast.error(parsedData.error);
          } else if (parsedData.type === 'game_created_10') {
            // Handle game creation from accepted challenge
            toast.success('Challenge accepted! Starting game...');
            navigate(`/game/${parsedData.gameId}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      // Store original handler
      const originalHandler = socket.onmessage;
      
      // Set combined handler
      socket.onmessage = (event) => {
        // Call original handler first
        if (originalHandler && typeof originalHandler === 'function') {
          originalHandler(event);
        }
        // Then call our handler
        handleMessage(event);
      };

      // Send user connected message
      socket.send(JSON.stringify({
        type: 'user_connected',
        user: {
          userId: user.user.id,
          username: user.user.username,
          rating: user.user.rating
        }
      }));

      return () => {
        // Restore original handler
        if (socket) {
          socket.onmessage = originalHandler;
        }
      };
    }
  }, [socket, user, navigate, activeTab]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
        Friends & Social
      </h2>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-[#111] rounded-lg p-1 flex">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'friends' 
                ? 'bg-[#16A34A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'requests' 
                ? 'bg-[#16A34A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Requests ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'challenges' 
                ? 'bg-[#16A34A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Challenges ({receivedChallenges.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'search' 
                ? 'bg-[#16A34A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Add Friends
          </button>
        </div>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xl font-bold text-white">Your Friends</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.id} className="p-4 hover:bg-black/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{friend.username}</div>
                      <div className="text-gray-400 text-sm">Rating: {friend.rating}</div>
                      <div className="text-gray-500 text-xs">Friends since {formatDate(friend.friendshipCreatedAt)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => challengeFriend(friend.id, friend.username)}
                        isLoading={loadingStates.challengeFriend[friend.id]}
                        disabled={loadingStates.challengeFriend[friend.id]}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4"
                      >
                        {loadingStates.challengeFriend[friend.id] ? 'Sending...' : 'Send Challenge'}
                      </Button>
                      <Button
                        onClick={() => removeFriend(friend.id)}
                        isLoading={loadingStates.removeFriend[friend.id]}
                        disabled={loadingStates.removeFriend[friend.id]}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4"
                      >
                        {loadingStates.removeFriend[friend.id] ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                No friends yet. Use the "Add Friends" tab to find players!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Received Requests</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{request.senderUsername}</div>
                        <div className="text-gray-400 text-sm">Rating: {request.senderRating}</div>
                        <div className="text-gray-500 text-xs">Sent {formatDate(request.createdAt)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptFriendRequest(request.id)}
                          isLoading={loadingStates.acceptRequest[request.id]}
                          disabled={loadingStates.acceptRequest[request.id] || loadingStates.rejectRequest[request.id]}
                          className="bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] px-4"
                        >
                          {loadingStates.acceptRequest[request.id] ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button
                          onClick={() => rejectFriendRequest(request.id)}
                          isLoading={loadingStates.rejectRequest[request.id]}
                          disabled={loadingStates.acceptRequest[request.id] || loadingStates.rejectRequest[request.id]}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4"
                        >
                          {loadingStates.rejectRequest[request.id] ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No pending friend requests
                </div>
              )}
            </div>
          </div>

          {/* Sent Requests */}
          <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Sent Requests</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {sentRequests.length > 0 ? (
                sentRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{request.receiverUsername}</div>
                        <div className="text-gray-400 text-sm">Rating: {request.receiverRating}</div>
                        <div className="text-gray-500 text-xs">Sent {formatDate(request.createdAt)}</div>
                      </div>
                      <div className="text-yellow-400 text-sm">Pending</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No sent requests
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Received Challenges */}
          <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Received Challenges</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {receivedChallenges.length > 0 ? (
                receivedChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{challenge.challengerUsername}</div>
                        <div className="text-gray-400 text-sm">Rating: {challenge.challengerRating}</div>
                        <div className="text-blue-400 text-sm">Time: {Math.floor(challenge.timeControl / 60)} minutes</div>
                        <div className="text-gray-500 text-xs">Sent {formatDate(challenge.createdAt)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptChallenge(challenge)}
                          className="bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] px-4"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectChallenge(challenge)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No pending challenges
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Find Friends</h3>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-[#16A34A] focus:outline-none"
            />
          </div>
          <div className="divide-y divide-gray-800">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loading />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((searchUser) => (
                <div key={searchUser.id} className="p-4 hover:bg-black/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{searchUser.username}</div>
                      <div className="text-gray-400 text-sm">Rating: {searchUser.rating}</div>
                    </div>
                    <div>
                      {searchUser.isFriend ? (
                        <span className="text-[#16A34A] text-sm">✓ Friend</span>
                      ) : searchUser.hasPendingRequest ? (
                        <span className="text-yellow-400 text-sm">Request Sent</span>
                      ) : (
                        <Button
                          onClick={() => sendFriendRequest(searchUser.username)}
                          isLoading={loadingStates.sendRequest[searchUser.username]}
                          disabled={loadingStates.sendRequest[searchUser.username]}
                          className="bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] px-4"
                        >
                          {loadingStates.sendRequest[searchUser.username] ? 'Sending...' : 'Add Friend'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="p-8 text-center text-gray-400">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                Start typing to search for players
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer theme="dark" />
    </div>
  );
};

export default Friends;
