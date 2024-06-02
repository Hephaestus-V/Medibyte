import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import abi from "../abis/Health_Contract.json";

const PatientsSheet = () => {
  const [patients, setPatients] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const authorizedAddress = import.meta.env.VITE_DOCTOR.toLowerCase();
  const contractAddress = import.meta.env.VITE_HEALTH_CONTRACT;
  const contractABI = abi;

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!window.ethereum) {
          alert("MetaMask extension not detected. Please install MetaMask.");
          console.error('MetaMask is not installed');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        // console.log('User Address:', userAddress);
        // console.log('Authorized Address:', authorizedAddress);

        if (userAddress.toLowerCase() === authorizedAddress) {
          setIsAuthorized(true);
          fetchPatients(signer);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
      }
    };

    const fetchPatients = async (signer) => {
      try {
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Health Contract is working at address: ",contract.target);
        // console.log(selectedTests);
        contract.on('TestsSelected', (patientAddress, selectedTests) => {
          console.log('Event received:', patientAddress, selectedTests);
          setPatients(prevPatients => [...prevPatients, { address: patientAddress, selectedTests }]);
        });
        console.log('Contract event listener set up');
        console.log(patients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    checkAuthorization();

    return () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        contract.removeAllListeners('TestsSelected');
      }
    };
  }, [authorizedAddress, contractABI, contractAddress]);

  const handleRowClick = (address, selectedTests) => {
    navigate(`/patient/${address}`, { state: { selectedTests } });
  };

  if (!isAuthorized) {
    return <div className="text-center mt-10 text-red-500">You are not authorized to access this page.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Registered Patient Addresses</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.address} onClick={() => handleRowClick(patient.address, patient.selectedTests)} className="cursor-pointer hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{patient.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientsSheet;
